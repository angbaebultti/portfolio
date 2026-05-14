import { useLoader } from '@react-three/fiber'
import { useMemo, type MutableRefObject } from 'react'
import * as THREE from 'three'
import onlyCloudUrl from '../../assets/only_cloud.png'

interface CloudClusterProps {
  scrollProgressRef?: MutableRefObject<number>
}

export default function CloudCluster({ scrollProgressRef: _scrollProgressRef }: CloudClusterProps) {
  const cloudTexture = useLoader(THREE.TextureLoader, onlyCloudUrl)

  const { leftTexture, rightTexture } = useMemo(() => {
    const makeSideTexture = (offsetX: number) => {
      const texture = cloudTexture.clone()
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.offset.set(offsetX, 0)
      texture.repeat.set(0.5, 1)
      texture.needsUpdate = true
      return texture
    }

    return {
      leftTexture: makeSideTexture(0),
      rightTexture: makeSideTexture(0.5),
    }
  }, [cloudTexture])

  return (
    <group renderOrder={30}>
      <mesh position={[-10, 5, -12]} scale={[20, 18, 1]} renderOrder={31}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={leftTexture}
          transparent
          alphaTest={0.01}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[10, 5, -12]} scale={[20, 18, 1]} renderOrder={32}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={rightTexture}
          transparent
          alphaTest={0.01}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
